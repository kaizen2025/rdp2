// src/pages/AccessoriesManagement.js - CORRIGÉ POUR UTILISER L'API WEB

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Grid, FormControl, InputLabel, Select, MenuItem,
    Chip, Switch, FormControlLabel, CircularProgress
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MouseIcon from '@mui/icons-material/Mouse';
import PowerIcon from '@mui/icons-material/Power';
import WorkIcon from '@mui/icons-material/Work';
import UsbIcon from '@mui/icons-material/Usb';
import CableIcon from '@mui/icons-material/Cable';
import DockIcon from '@mui/icons-material/Dock';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HeadsetIcon from '@mui/icons-material/Headset';
import StorageIcon from '@mui/icons-material/Storage';
import DevicesIcon from '@mui/icons-material/Devices';

import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService'; // Utiliser le service API

const AVAILABLE_ICONS = [
    { id: 'mouse', label: 'Souris', icon: <MouseIcon /> },
    { id: 'power', label: 'Chargeur', icon: <PowerIcon /> },
    { id: 'work', label: 'Sacoche', icon: <WorkIcon /> },
    { id: 'usb', label: 'Câble USB', icon: <UsbIcon /> },
    { id: 'cable', label: 'Câble Divers', icon: <CableIcon /> },
    { id: 'dock', label: 'Station d\'accueil', icon: <DockIcon /> },
    { id: 'keyboard', label: 'Clavier', icon: <KeyboardIcon /> },
    { id: 'headset', label: 'Casque', icon: <HeadsetIcon /> },
    { id: 'storage', label: 'Stockage', icon: <StorageIcon /> },
    { id: 'devices', label: 'Autre Périphérique', icon: <DevicesIcon /> },
];

const AccessoriesManagement = () => {
    const { showNotification } = useApp();
    const [accessories, setAccessories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAccessory, setEditingAccessory] = useState(null);
    const [formData, setFormData] = useState({ name: '', icon: 'devices', active: true });

    const loadAccessories = useCallback(async () => {
        setIsLoading(true);
        try {
            // CORRECTION: Utilisation de apiService
            const data = await apiService.getAccessories();
            setAccessories(data || []);
        } catch (err) {
            showNotification('error', 'Erreur lors du chargement des accessoires');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadAccessories();
    }, [loadAccessories]);

    const handleOpenDialog = (accessory = null) => {
        if (accessory) {
            setEditingAccessory(accessory);
            setFormData(accessory);
        } else {
            setEditingAccessory(null);
            setFormData({ name: '', icon: 'devices', active: true });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingAccessory(null);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showNotification('error', 'Le nom de l\'accessoire est requis');
            return;
        }

        try {
            // CORRECTION: Utilisation de apiService
            await apiService.saveAccessory(formData);
            showNotification('success', `Accessoire ${editingAccessory ? 'modifié' : 'ajouté'} avec succès.`);
            handleCloseDialog();
            await loadAccessories();
        } catch (err) {
            showNotification('error', `Erreur lors de la sauvegarde: ${err.message}`);
        }
    };

    const handleDelete = async (accessory) => {
        if (!window.confirm(`Supprimer l'accessoire "${accessory.name}" ?`)) return;

        try {
            // CORRECTION: Utilisation de apiService
            await apiService.deleteAccessory(accessory.id);
            showNotification('success', 'Accessoire supprimé.');
            await loadAccessories();
        } catch (err) {
            showNotification('error', `Erreur lors de la suppression: ${err.message}`);
        }
    };

    const getIconComponent = (iconId) => {
        const iconConfig = AVAILABLE_ICONS.find(i => i.id === iconId);
        return iconConfig ? iconConfig.icon : <DevicesIcon />;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box><Typography variant="h5" gutterBottom>Gestion des Accessoires</Typography><Typography variant="body2" color="text.secondary">Configurez les accessoires disponibles pour les prêts de matériel.</Typography></Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Ajouter un accessoire</Button>
            </Box>

            <Paper elevation={3}>
                <TableContainer>
                    <Table>
                        <TableHead><TableRow><TableCell>Icône</TableCell><TableCell>Nom</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                        <TableBody>
                            {isLoading ? (<TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>) : accessories.length === 0 ? (<TableRow><TableCell colSpan={4} align="center">Aucun accessoire configuré</TableCell></TableRow>) : (
                                accessories.map(accessory => (
                                    <TableRow key={accessory.id} hover>
                                        <TableCell>{getIconComponent(accessory.icon)}</TableCell>
                                        <TableCell><Typography variant="body1" fontWeight="medium">{accessory.name}</Typography></TableCell>
                                        <TableCell><Chip label={accessory.active ? "Actif" : "Inactif"} color={accessory.active ? "success" : "default"} size="small" /></TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleOpenDialog(accessory)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(accessory)}><DeleteIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingAccessory ? 'Modifier l\'accessoire' : 'Ajouter un accessoire'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}><TextField label="Nom de l'accessoire *" fullWidth value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Chargeur USB-C 65W" /></Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Icône</InputLabel>
                                <Select value={formData.icon || 'devices'} label="Icône" onChange={(e) => setFormData({ ...formData, icon: e.target.value })}>
                                    {AVAILABLE_ICONS.map(icon => (<MenuItem key={icon.id} value={icon.id}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{icon.icon}{icon.label}</Box></MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}><FormControlLabel control={<Switch checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />} label="Accessoire actif (disponible pour les prêts)" /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSave} variant="contained">{editingAccessory ? 'Modifier' : 'Sauvegarder'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AccessoriesManagement;