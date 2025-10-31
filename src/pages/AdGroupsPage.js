// src/pages/AdGroupsPage.js - VERSION FINALE AVEC IMPORTS CORRIGÉS

import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
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
import apiService from '../services/apiService';
import PageHeader from '../components/common/PageHeader';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const MemberRow = memo(({ member, style, isOdd, onRemove, groupName }) => (
    <Box style={style} sx={{ display: 'flex', alignItems: 'center', px: 2, backgroundColor: isOdd ? 'grey.50' : 'white', borderBottom: '1px solid', borderColor: 'divider', '&:hover': { backgroundColor: 'action.hover' } }}>
        <Box sx={{ flex: 1, pr: 2 }}><Typography variant="body2" fontWeight={500}>{member.DisplayName || member.name}</Typography><Typography variant="caption" color="text.secondary">{member.SamAccountName || member.sam}</Typography></Box>
        <Tooltip title="Retirer du groupe"><IconButton size="small" color="error" onClick={() => onRemove(member.SamAccountName || member.sam, groupName)}><PersonRemoveIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
));

const AdGroupsPage = () => {
    const { showNotification } = useApp();
    const { cache, isLoading: isCacheLoading, invalidate } = useCache();
    
    const config = useMemo(() => cache.config || {}, [cache.config]);
    const adGroups = useMemo(() => config?.ad_groups || {}, [config]);
    const groupKeys = useMemo(() => Object.keys(adGroups), [adGroups]);
    
    const [selectedGroup, setSelectedGroup] = useState(groupKeys.length > 0 ? groupKeys[0] : '');
    const [searchTerm, setSearchTerm] = useState('');
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const members = useMemo(() => cache[`ad_groups:${selectedGroup}`] || [], [cache, selectedGroup]);

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
        if (!searchTerm) return members;
        const term = searchTerm.toLowerCase();
        return members.filter(m => (m.DisplayName || m.name || '').toLowerCase().includes(term) || (m.SamAccountName || m.sam || '').toLowerCase().includes(term));
    }, [members, searchTerm]);

    const handleRemoveUser = async (username, groupName) => {
        if (!window.confirm(`Retirer ${username} du groupe ${groupName} ?`)) return;
        try {
            await apiService.removeUserFromGroup(username, groupName);
            showNotification('success', `${username} retiré du groupe.`);
            await invalidate(`ad_groups:${groupName}`);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const handleAddUser = async (username) => {
        try {
            await apiService.addUserToGroup(username, selectedGroup);
            showNotification('success', `${username} ajouté au groupe.`);
            await invalidate(`ad_groups:${selectedGroup}`);
            setAddUserDialogOpen(false);
        } catch (error) { showNotification('error', `Erreur: ${error.message}`); }
    };

    const searchAdUsers = useCallback(async (term) => {
        if (!term || term.length < 2) { setAvailableUsers([]); return; }
        setSearchingUsers(true);
        try {
            const users = await apiService.searchAdUsers(term);
            setAvailableUsers(users || []);
        } catch (error) { showNotification('error', `Erreur recherche: ${error.message}`); } 
        finally { setSearchingUsers(false); }
    }, [showNotification]);

    const handleOpenAddDialog = () => { setUserSearchTerm(''); setAvailableUsers([]); setAddUserDialogOpen(true); };
    const Row = ({ index, style }) => <MemberRow member={filteredMembers[index]} style={style} isOdd={index % 2 === 1} onRemove={handleRemoveUser} groupName={selectedGroup} />;
    const currentGroupData = useMemo(() => adGroups[selectedGroup] || {}, [adGroups, selectedGroup]);

    if (isCacheLoading && !config.domain) {
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
                    <FormControl sx={{ minWidth: 300 }}><InputLabel>Groupe</InputLabel><Select value={selectedGroup} label="Groupe" onChange={(e) => setSelectedGroup(e.target.value)}>{Object.entries(adGroups).map(([key, group]) => (<MenuItem key={key} value={key}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon fontSize="small" />{group.name}<Chip label={group.type} size="small" variant="outlined" /></Box></MenuItem>))}</Select></FormControl>
                    <Box sx={{ flexGrow: 1 }}><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher un membre..." fullWidth /></Box>
                    <Chip icon={<GroupIcon />} label={`${filteredMembers.length} membre(s)`} color="primary" />
                </Box>
                {currentGroupData.description && (<Box sx={{ p: 1.5, backgroundColor: 'info.lighter', borderRadius: 1, display: 'flex', gap: 1 }}><InfoIcon color="info" fontSize="small" /><Typography variant="body2" color="info.dark">{currentGroupData.description}</Typography></Box>)}
            </Paper>
            {isRefreshing ? <LoadingScreen type="list" /> : filteredMembers.length === 0 ? <Paper elevation={2} sx={{ p: 4 }}><EmptyState type={searchTerm ? 'search' : 'empty'} onAction={searchTerm ? () => setSearchTerm('') : handleOpenAddDialog} /></Paper> : (
                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}><AutoSizer>{({ height, width }) => (<FixedSizeList height={height} itemCount={filteredMembers.length} itemSize={60} width={width}>{Row}</FixedSizeList>)}</AutoSizer></Box>
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