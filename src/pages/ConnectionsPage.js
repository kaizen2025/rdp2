// src/pages/ConnectionsPage.js - Version finale restaurée et améliorée

import React, { useState, useMemo, useEffect, memo } from 'react';
import { useApp } from '../contexts/AppContext';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';

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

// --- Sous-composants ---

const ManualConnectionDialog = ({ open, server, config, onClose, onSubmit }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '', domain: '' });
    useEffect(() => { if (open) setCredentials({ username: '', password: '', domain: config?.domain || '' }); }, [open, config]);
    const handleSubmit = () => { if (credentials.username && credentials.password) { onSubmit({ ...credentials, server }); onClose(); } };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Connexion Manuelle - {server}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>Saisissez les identifiants pour vous connecter à ce serveur.</DialogContentText>
                <TextField autoFocus margin="dense" label="Nom d'utilisateur" fullWidth value={credentials.username} onChange={(e) => setCredentials(p => ({...p, username: e.target.value}))} />
                <TextField margin="dense" label="Mot de passe" type="password" fullWidth value={credentials.password} onChange={(e) => setCredentials(p => ({...p, password: e.target.value}))} />
                <TextField margin="dense" label="Domaine (optionnel)" fullWidth value={credentials.domain} onChange={(e) => setCredentials(p => ({...p, domain: e.target.value}))} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained">Se connecter</Button>
            </DialogActions>
        </Dialog>
    );
};

const ServerListItem = memo(({ server, editMode, onAdminConnect, onManualConnect, onPing, onEdit, onDelete }) => (
    <ListItem divider secondaryAction={<Box sx={{ display: 'flex', gap: 0.5 }}><Tooltip title="Connexion Admin"><IconButton size="small" onClick={() => onAdminConnect(server)}><AdminPanelSettingsIcon /></IconButton></Tooltip><Tooltip title="Connexion Manuelle"><IconButton size="small" onClick={() => onManualConnect(server)}><ManageAccountsIcon /></IconButton></Tooltip><Tooltip title="Ping"><IconButton size="small" onClick={() => onPing(server)}><NetworkPingIcon /></IconButton></Tooltip>{editMode && (<><Tooltip title="Renommer"><IconButton size="small" onClick={() => onEdit(server)}><EditIcon /></IconButton></Tooltip><Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => onDelete(server)}><DeleteIcon /></IconButton></Tooltip></>)}</Box>} >
        {editMode && <DragIndicatorIcon color="action" sx={{ cursor: 'grab', mr: 1 }} />}
        <ListItemIcon><ComputerIcon color="primary" /></ListItemIcon>
        <ListItemText primary={server} />
    </ListItem>
));

const ServerGroup = memo(({ groupName, servers, editMode, onDragStart, onDrop, onDragOver, ...actions }) => {
    const [dragOver, setDragOver] = useState(false);
    return (<Paper elevation={dragOver ? 4 : 1} sx={{ border: dragOver ? '2px dashed' : '1px solid', borderColor: dragOver ? 'primary.main' : 'divider' }} onDragOver={(e) => { e.preventDefault(); if (editMode) setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e, groupName); }}><Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6">{groupName} ({servers.length})</Typography>{editMode && (<Box><Tooltip title="Ajouter"><IconButton size="small" onClick={() => actions.onAddServer(groupName)}><AddIcon /></IconButton></Tooltip><Tooltip title="Renommer"><IconButton size="small" onClick={() => actions.onEditGroup(groupName)}><EditIcon /></IconButton></Tooltip><Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => actions.onDeleteGroup(groupName)}><DeleteIcon /></IconButton></Tooltip></Box>)}</Box><List dense>{servers.map(server => (<div key={server} draggable={editMode} onDragStart={(e) => onDragStart(e, `${groupName}/${server}`)}><ServerListItem server={server} editMode={editMode} {...actions} onEdit={() => actions.onEditServer(groupName, server)} onDelete={() => actions.onDeleteServer(groupName, server)} /></div>))}</List></Paper>);
});

const EditDialog = ({ open, type, item, group, onClose, onSubmit }) => {
    const [value, setValue] = useState('');
    useEffect(() => { if (open) setValue(item || ''); }, [open, item]);
    const title = { addGroup: "Créer un groupe", renameGroup: `Renommer "${item}"`, addServer: `Ajouter à "${group}"`, editServer: `Renommer "${item}"` }[type];
    return (<Dialog open={open} onClose={onClose}><DialogTitle>{title}</DialogTitle><DialogContent><TextField autoFocus margin="dense" label="Nom" fullWidth value={value} onChange={e => setValue(e.target.value)} /></DialogContent><DialogActions><Button onClick={onClose}>Annuler</Button><Button onClick={() => { onSubmit(value); onClose(); }}>Confirmer</Button></DialogActions></Dialog>);
};

const ConnectionsPage = () => {
    const { config, handleSaveConfig, showNotification } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [pingResult, setPingResult] = useState({ open: false, text: '' });
    const [editMode, setEditMode] = useState(false);
    const [editableGroups, setEditableGroups] = useState(config?.server_groups || {});
    const [dialog, setDialog] = useState({ open: false, type: null, item: '', group: '' });
    const [manualConnectionDialog, setManualConnectionDialog] = useState({ open: false, server: '' });
    const [draggedItem, setDraggedItem] = useState(null);

    useEffect(() => { setEditableGroups(config?.server_groups || {}); }, [config]);

    const filteredServerGroups = useMemo(() => {
        const groups = editMode ? editableGroups : config?.server_groups || {};
        if (!searchTerm) return groups;
        const term = searchTerm.toLowerCase();
        const filtered = {};
        for (const groupName in groups) {
            const matchingServers = groups[groupName].filter(s => s.toLowerCase().includes(term));
            if (matchingServers.length > 0 || groupName.toLowerCase().includes(term)) filtered[groupName] = matchingServers;
        }
        return filtered;
    }, [searchTerm, config?.server_groups, editMode, editableGroups]);

    const handleAdminConnect = (server) => window.electronAPI.quickConnect(server);
    const handlePing = async (server) => { setPingResult({ open: true, text: `Ping de ${server}...` }); const res = await window.electronAPI.pingServer(server); setPingResult({ open: true, text: res.output }); };
    const handleManualConnect = (server) => setManualConnectionDialog({ open: true, server });
    const handleSaveChanges = async () => { const success = await handleSaveConfig({ newConfig: { ...config, server_groups: editableGroups } }); if (success) { setEditMode(false); showNotification('success', 'Groupes de serveurs mis à jour.'); } else { showNotification('error', 'La sauvegarde a échoué.'); } };
    const handleDragStart = (e, nodeId) => { if (editMode) setDraggedItem(nodeId); };
    const handleDrop = (e, targetGroup) => { if (!editMode || !draggedItem) return; const [draggedGroup, draggedServer] = draggedItem.split('/'); if (draggedServer && draggedGroup !== targetGroup) { const newGroups = { ...editableGroups }; newGroups[draggedGroup] = newGroups[draggedGroup].filter(s => s !== draggedServer); if (!newGroups[targetGroup].includes(draggedServer)) newGroups[targetGroup] = [...newGroups[targetGroup], draggedServer].sort(); setEditableGroups(newGroups); } setDraggedItem(null); };
    const handleDialogSubmit = (value) => { const { type, group, item } = dialog; let newGroups = { ...editableGroups }; if (type === 'addGroup') { if (value && !newGroups[value]) newGroups[value] = []; } else if (type === 'renameGroup') { if (value && value !== item && !newGroups[value]) { newGroups[value] = newGroups[item]; delete newGroups[item]; } } else if (type === 'deleteGroup') { delete newGroups[item]; } else if (type === 'addServer') { if (value && !newGroups[group].includes(value)) { newGroups[group].push(value); newGroups[group].sort(); } } else if (type === 'editServer') { const i = newGroups[group].indexOf(item); if (i > -1 && value && !newGroups[group].includes(value)) { newGroups[group][i] = value; newGroups[group].sort(); } } else if (type === 'deleteServer') { newGroups[group] = newGroups[group].filter(s => s !== item); } setEditableGroups(newGroups); };

    return (
        <Box sx={{ p: 2 }}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h5">Gestion des Serveurs</Typography><FormControlLabel control={<Switch checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />} label="Mode édition" /></Box>
                <TextField fullWidth label="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small" sx={{ mt: 2 }} />
                {editMode && (<Box sx={{ mt: 2, display: 'flex', gap: 2 }}><Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveChanges}>Sauvegarder</Button><Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog({ open: true, type: 'addGroup' })}>Nouveau Groupe</Button><Button variant="outlined" startIcon={<CancelIcon />} onClick={() => { setEditMode(false); setEditableGroups(config?.server_groups || {}); }}>Annuler</Button></Box>)}
            </Paper>
            <Grid container spacing={2}>
                {Object.entries(filteredServerGroups).map(([groupName, servers]) => (
                    <Grid item xs={12} md={6} key={groupName}>
                        <ServerGroup groupName={groupName} servers={servers} editMode={editMode} onDragStart={handleDragStart} onDrop={handleDrop} onAdminConnect={handleAdminConnect} onManualConnect={handleManualConnect} onPing={handlePing} onAddServer={(group) => setDialog({ open: true, type: 'addServer', group })} onEditGroup={(group) => setDialog({ open: true, type: 'renameGroup', item: group })} onDeleteGroup={(group) => setDialog({ open: true, type: 'deleteGroup', item: group })} onEditServer={(group, server) => setDialog({ open: true, type: 'editServer', group, item: server })} onDeleteServer={(group, server) => setDialog({ open: true, type: 'deleteServer', group, item: server })} />
                    </Grid>
                ))}
            </Grid>
            <EditDialog open={dialog.open && ['addGroup', 'renameGroup', 'addServer', 'editServer'].includes(dialog.type)} {...dialog} onClose={() => setDialog({ open: false })} onSubmit={handleDialogSubmit} />
            <Dialog open={dialog.open && ['deleteGroup', 'deleteServer'].includes(dialog.type)} onClose={() => setDialog({ open: false })}><DialogTitle>Confirmer</DialogTitle><DialogContent><Typography>Supprimer "{dialog.item}" ?</Typography></DialogContent><DialogActions><Button onClick={() => setDialog({ open: false })}>Annuler</Button><Button onClick={() => { handleDialogSubmit(); setDialog({ open: false }); }} color="error">Supprimer</Button></DialogActions></Dialog>
            <Snackbar open={pingResult.open} autoHideDuration={6000} onClose={() => setPingResult({ open: false, text: '' })} message={pingResult.text} />
            <ManualConnectionDialog open={manualConnectionDialog.open} server={manualConnectionDialog.server} config={config} onClose={() => setManualConnectionDialog({ open: false, server: '' })} onSubmit={(creds) => window.electronAPI.connectWithStoredCredentials(creds)} />
        </Box>
    );
};

export default ConnectionsPage;