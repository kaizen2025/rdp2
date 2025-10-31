// src/pages/ConnectionsPage.js - Version finale avec Drag-and-Drop (dnd-kit) et UI corrigée

import React, { useState, useMemo, useEffect, memo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Switch, FormControlLabel, List, ListItem, ListItemText, ListItemIcon, Grid, Snackbar, TextField } from '@mui/material';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icons
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NetworkPingIcon from '@mui/icons-material/NetworkPing';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ComputerIcon from '@mui/icons-material/Computer';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoIcon from '@mui/icons-material/Info';

const ManualConnectionDialog = ({ open, server, config, onClose, onSubmit }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '', domain: '' });
    useEffect(() => { if (open) setCredentials({ username: '', password: '', domain: config?.domain || '' }); }, [open, config]);
    const handleSubmit = () => { if (credentials.username && credentials.password) { onSubmit({ ...credentials, server }); onClose(); } };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Connexion Manuelle - {server}</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="Nom d'utilisateur" fullWidth value={credentials.username} onChange={(e) => setCredentials(p => ({...p, username: e.target.value}))} />
                <TextField margin="dense" label="Mot de passe" type="password" fullWidth value={credentials.password} onChange={(e) => setCredentials(p => ({...p, password: e.target.value}))} />
                <TextField margin="dense" label="Domaine (optionnel)" fullWidth value={credentials.domain} onChange={(e) => setCredentials(p => ({...p, domain: e.target.value}))} />
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Se connecter</Button></DialogActions>
        </Dialog>
    );
};

const SortableServerItem = memo(({ id, server, groupName, editMode, actions }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1 : 0, position: 'relative' };

    return (
        <ListItem ref={setNodeRef} style={style} divider secondaryAction={
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Informations (à venir)"><span><IconButton size="small" disabled><InfoIcon /></IconButton></span></Tooltip>
                <Tooltip title="Connexion Admin (app bureau)"><span><IconButton size="small" onClick={() => actions.onAdminConnect(server)} disabled={!window.electronAPI}><AdminPanelSettingsIcon /></IconButton></span></Tooltip>
                <Tooltip title="Connexion Manuelle (app bureau)"><span><IconButton size="small" onClick={() => actions.onManualConnect(server)} disabled={!window.electronAPI}><ManageAccountsIcon /></IconButton></span></Tooltip>
                <Tooltip title="Ping (app bureau)"><span><IconButton size="small" onClick={() => actions.onPing(server)} disabled={!window.electronAPI}><NetworkPingIcon /></IconButton></span></Tooltip>
                {editMode && (
                    <>
                        <Tooltip title="Modifier"><IconButton size="small" onClick={() => actions.onEditServer(groupName, server)}><EditIcon /></IconButton></Tooltip>
                        <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => actions.onDeleteServer(groupName, server)}><DeleteIcon /></IconButton></Tooltip>
                    </>
                )}
            </Box>
        }>
            {editMode && <DragIndicatorIcon color="action" sx={{ cursor: 'grab', touchAction: 'none' }} {...attributes} {...listeners} />}
            <ListItemIcon><ComputerIcon color={server.useCustomCredentials ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText primary={server.name} secondary={server.hostname} />
        </ListItem>
    );
});

const ServerEditDialog = ({ open, server, groupName, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ name: '', hostname: '', useCustomCredentials: false, username: '', password: '', domain: '' });
    useEffect(() => { if (open) setFormData(server || { name: '', hostname: '', useCustomCredentials: false, username: '', password: '', domain: '' }); }, [open, server]);
    const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };
    const handleSubmit = () => { onSubmit(formData); onClose(); };
    return ( <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth> <DialogTitle>{server ? `Modifier ${server.name}` : `Ajouter un serveur à ${groupName}`}</DialogTitle> <DialogContent> <Grid container spacing={2} sx={{ pt: 1 }}> <Grid item xs={12} sm={6}><TextField name="name" label="Nom d'affichage" value={formData.name} onChange={handleChange} fullWidth /></Grid> <Grid item xs={12} sm={6}><TextField name="hostname" label="IP / Nom d'hôte" value={formData.hostname} onChange={handleChange} fullWidth /></Grid> <Grid item xs={12}><FormControlLabel control={<Switch name="useCustomCredentials" checked={formData.useCustomCredentials} onChange={handleChange} />} label="Identifiants spécifiques" /></Grid> {formData.useCustomCredentials && <> <Grid item xs={12} sm={6}><TextField name="username" label="Utilisateur" value={formData.username} onChange={handleChange} fullWidth /></Grid> <Grid item xs={12} sm={6}><TextField name="password" label="Mot de passe" type="password" value={formData.password} onChange={handleChange} fullWidth /></Grid> <Grid item xs={12}><TextField name="domain" label="Domaine" value={formData.domain} onChange={handleChange} fullWidth /></Grid> </>} </Grid> </DialogContent> <DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Sauvegarder</Button></DialogActions> </Dialog> );
};

const GroupEditDialog = ({ open, type, item, onClose, onSubmit }) => {
    const [value, setValue] = useState('');
    useEffect(() => { if (open) setValue(item || ''); }, [open, item]);
    const title = type === 'addGroup' ? "Créer un groupe" : `Renommer "${item}"`;
    return (<Dialog open={open} onClose={onClose}><DialogTitle>{title}</DialogTitle><DialogContent><TextField autoFocus margin="dense" label="Nom du groupe" fullWidth value={value} onChange={e => setValue(e.target.value)} /></DialogContent><DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={() => { onSubmit(value); onClose(); }}>Confirmer</Button></DialogActions></Dialog>);
};

const ConnectionsPage = () => {
    const { config, handleSaveConfig, showNotification } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [pingResult, setPingResult] = useState({ open: false, text: '' });
    const [editMode, setEditMode] = useState(false);
    const [editableGroups, setEditableGroups] = useState({});
    const [dialog, setDialog] = useState({ open: false, type: null, item: null, group: '' });
    const [manualConnectionDialog, setManualConnectionDialog] = useState({ open: false, server: '' });
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        const groups = config?.server_groups || {};
        const upgradedGroups = {};
        for (const groupName in groups) {
            upgradedGroups[groupName] = (groups[groupName] || []).map(server =>
                typeof server === 'string' ? { name: server, hostname: server, useCustomCredentials: false } : { ...{ useCustomCredentials: false }, ...server }
            );
        }
        setEditableGroups(upgradedGroups);
    }, [config, editMode]);

    const filteredServerGroups = useMemo(() => {
        if (!searchTerm) return editableGroups;
        const term = searchTerm.toLowerCase();
        const filtered = {};
        for (const groupName in editableGroups) {
            const matchingServers = editableGroups[groupName].filter(s => s.name.toLowerCase().includes(term) || s.hostname.toLowerCase().includes(term));
            if (matchingServers.length > 0 || groupName.toLowerCase().includes(term)) filtered[groupName] = matchingServers;
        }
        return filtered;
    }, [searchTerm, editableGroups]);

    const handleAdminConnect = (server) => {
        if (!window.electronAPI) return showNotification('info', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
        if (server.useCustomCredentials) {
            window.electronAPI.connectWithStoredCredentials({ server: server.hostname, username: server.username, password: server.password, domain: server.domain });
        } else {
            window.electronAPI.quickConnect(server.hostname);
        }
    };
    
    const handlePing = async (server) => {
        if (!window.electronAPI) return showNotification('info', 'Fonctionnalité disponible uniquement dans l\'application de bureau.');
        setPingResult({ open: true, text: `Ping de ${server.hostname}...` });
        const res = await window.electronAPI.pingServer(server.hostname);
        setPingResult({ open: true, text: res.output });
    };

    const handleManualConnect = (server) => setManualConnectionDialog({ open: true, server: server.hostname });

    const handleSaveChanges = async () => {
        const success = await handleSaveConfig({ newConfig: { ...config, server_groups: editableGroups } });
        if (success) {
            setEditMode(false);
            showNotification('success', 'Groupes de serveurs mis à jour.');
        } else {
            showNotification('error', 'La sauvegarde a échoué.');
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || !active || active.id === over.id) return;
    
        const activeId = active.id;
        const overId = over.id;
    
        const [activeGroup, activeServerName] = activeId.split('/');
        const overIsGroup = !overId.includes('/');
        const overGroup = overIsGroup ? overId : overId.split('/')[0];
    
        setEditableGroups(prev => {
            const newGroups = { ...prev };
            const activeServerIndex = newGroups[activeGroup].findIndex(s => s.name === activeServerName);
            if (activeServerIndex === -1) return prev;
    
            const [movedServer] = newGroups[activeGroup].splice(activeServerIndex, 1);
    
            if (overIsGroup) {
                newGroups[overGroup].push(movedServer);
            } else {
                const overServerName = overId.split('/')[1];
                const overServerIndex = newGroups[overGroup].findIndex(s => s.name === overServerName);
                if (overServerIndex !== -1) {
                    newGroups[overGroup].splice(overServerIndex, 0, movedServer);
                } else {
                    newGroups[overGroup].push(movedServer);
                }
            }
            return newGroups;
        });
    };

    const handleDialogSubmit = (data) => {
        const { type, group, item } = dialog;
        let newGroups = { ...editableGroups };
        if (type === 'addGroup') { if (data && !newGroups[data]) newGroups[data] = []; }
        else if (type === 'renameGroup') { if (data && data !== item && !newGroups[data]) { newGroups[data] = newGroups[item]; delete newGroups[item]; } }
        else if (type === 'deleteGroup') { delete newGroups[item]; }
        else if (type === 'addServer') { if (data.name && !newGroups[group].some(s => s.name === data.name)) { newGroups[group] = [...newGroups[group], data].sort((a,b) => a.name.localeCompare(b.name)); } }
        else if (type === 'editServer') { const index = newGroups[group].findIndex(s => s.name === item.name); if (index > -1) newGroups[group][index] = data; }
        else if (type === 'deleteServer') { newGroups[group] = newGroups[group].filter(s => s.name !== item.name); }
        setEditableGroups(newGroups);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box sx={{ p: 2 }}>
                <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">Gestion des Serveurs</Typography>
                        <FormControlLabel control={<Switch checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />} label="Mode édition" />
                    </Box>
                    <TextField fullWidth label="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small" sx={{ mt: 2 }} />
                    {editMode && (<Box sx={{ mt: 2, display: 'flex', gap: 2 }}><Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveChanges}>Sauvegarder</Button><Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog({ open: true, type: 'addGroup' })}>Nouveau Groupe</Button><Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setEditMode(false)}>Annuler</Button></Box>)}
                </Paper>
                <Grid container spacing={2}>
                    {Object.entries(filteredServerGroups).map(([groupName, servers]) => (
                        <Grid item xs={12} md={6} key={groupName}>
                            <Paper elevation={1} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h6">{groupName} ({servers.length})</Typography>
                                    {editMode && (<Box><Tooltip title="Ajouter"><IconButton size="small" onClick={() => setDialog({ open: true, type: 'addServer', group: groupName })}><AddIcon /></IconButton></Tooltip><Tooltip title="Renommer"><IconButton size="small" onClick={() => setDialog({ open: true, type: 'renameGroup', item: groupName })}><EditIcon /></IconButton></Tooltip><Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setDialog({ open: true, type: 'deleteGroup', item: groupName })}><DeleteIcon /></IconButton></Tooltip></Box>)}
                                </Box>
                                <List dense>
                                    <SortableContext items={servers.map(s => `${groupName}/${s.name}`)} strategy={verticalListSortingStrategy}>
                                        {servers.map(server => (
                                            <SortableServerItem
                                                key={server.name}
                                                id={`${groupName}/${server.name}`}
                                                server={server}
                                                groupName={groupName}
                                                editMode={editMode}
                                                actions={{ onAdminConnect: handleAdminConnect, onManualConnect: handleManualConnect, onPing: handlePing, onEditServer: (g, s) => setDialog({ open: true, type: 'editServer', group: g, item: s }), onDeleteServer: (g, s) => setDialog({ open: true, type: 'deleteServer', group: g, item: s }) }}
                                            />
                                        ))}
                                    </SortableContext>
                                </List>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                <ServerEditDialog open={dialog.open && ['addServer', 'editServer'].includes(dialog.type)} server={dialog.item} groupName={dialog.group} onClose={() => setDialog({ open: false })} onSubmit={handleDialogSubmit} />
                <GroupEditDialog open={dialog.open && ['addGroup', 'renameGroup'].includes(dialog.type)} type={dialog.type} item={dialog.item} onClose={() => setDialog({ open: false })} onSubmit={handleDialogSubmit} />
                <Dialog open={dialog.open && ['deleteGroup', 'deleteServer'].includes(dialog.type)} onClose={() => setDialog({ open: false })}><DialogTitle>Confirmer</DialogTitle><DialogContent><Typography>Supprimer "{dialog.item?.name || dialog.item}" ?</Typography></DialogContent><DialogActions><Button onClick={() => setDialog({ open: false })}>Annuler</Button><Button onClick={() => { handleDialogSubmit(); setDialog({ open: false }); }} color="error">Supprimer</Button></DialogActions></Dialog>
                <Snackbar open={pingResult.open} autoHideDuration={6000} onClose={() => setPingResult({ open: false, text: '' })} message={pingResult.text} />
                <ManualConnectionDialog open={manualConnectionDialog.open} server={manualConnectionDialog.server} config={config} onClose={() => setManualConnectionDialog({ open: false, server: '' })} onSubmit={(creds) => window.electronAPI.connectWithStoredCredentials(creds)} />
            </Box>
        </DndContext>
    );
};

export default ConnectionsPage;